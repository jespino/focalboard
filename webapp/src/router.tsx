// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useMemo} from 'react'
import {
    Router,
    Navigate,
    Routes,
    Route,
    useParams,
    useNavigate,
    generatePath,
} from 'react-router-dom'
import {createBrowserHistory, History} from 'history'

import {IAppWindow} from './types'
import BoardPage from './pages/boardPage/boardPage'
import ChangePasswordPage from './pages/changePasswordPage'
import WelcomePage from './pages/welcome/welcomePage'
import ErrorPage from './pages/errorPage'
import LoginPage from './pages/loginPage'
import RegisterPage from './pages/registerPage'
import {Utils} from './utils'
import octoClient from './octoClient'
import {UserSettingKey} from './userSettings'
import {IUser, UserPropPrefix} from './user'
import {setGlobalError, getGlobalError} from './store/globalError'
import {useAppSelector, useAppDispatch} from './store/hooks'
import {getFirstTeam, fetchTeams, Team} from './store/teams'
import {useCurrentRoutePath} from './hooks/router'
import {getLoggedIn, getMe} from './store/users'
import {UserSettings} from './userSettings'

declare let window: IAppWindow

const UUID_REGEX = new RegExp(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)

function HomeToCurrentTeam() {
    const firstTeam = useAppSelector<Team|null>(getFirstTeam)
    const dispatch = useAppDispatch()
    useEffect(() => {
        dispatch(fetchTeams())
    }, [])

    let teamID = (window.getCurrentTeamId && window.getCurrentTeamId()) || ''
    const lastTeamID = UserSettings.lastTeamId
    if (!teamID && !firstTeam && !lastTeamID) {
        return <></>
    }
    teamID = teamID || lastTeamID || firstTeam?.id || ''

    if (UserSettings.lastBoardId) {
        const lastBoardID = UserSettings.lastBoardId[teamID]
        const lastViewID = UserSettings.lastViewId[lastBoardID]

        if (lastBoardID && lastViewID) {
            return <Navigate to={`team/${teamID}/${lastBoardID}/${lastViewID}`} replace/>
        }
        if (lastBoardID) {
            return <Navigate to={`team/${teamID}/${lastBoardID}`} replace/>
        }
    }

    return <Navigate to={`team/${teamID}`} replace/>
}

function WorkspaceToTeamRedirect() {
    const params = useParams<{boardId: string, viewId: string, cardId?: string, workspaceId?: string}>()
    const navigate = useNavigate()
    useEffect(() => {
        octoClient.getBoard(params.boardId!).then((board) => {
            if (board) {
                navigate(generatePath('/team/:teamId/:boardId?/:viewId?/:cardId?', {
                    teamId: board?.teamId,
                    boardId: board?.id,
                    viewId: params.viewId,
                    cardId: params.cardId,
                }), {replace: true})
            }
        })
    }, [])
    return null
}

function GlobalErrorRedirect() {
    const globalError = useAppSelector<string>(getGlobalError)
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    useEffect(() => {
        if (globalError) {
            dispatch(setGlobalError(''))
            navigate(`/error?id=${globalError}`, {replace: true})
        }
    }, [globalError, navigate])

    return null
}

type LoginRequiredProps = {
    pathType?: string
    children?: React.ReactElement
    skipWelcome?: boolean
}

function LoginRequired(props: LoginRequiredProps): React.ReactElement|null {
    const loggedIn = useAppSelector<boolean|null>(getLoggedIn)
    const params = useParams<any>()
    const me = useAppSelector<IUser|null>(getMe)

    let originalPath
    if (props.pathType === "board") {
        originalPath = `/board/${Utils.buildOriginalPath('', params.boardId, params.viewId, params.cardId)}`
    } else if (props.pathType === "team") {
        originalPath = `/team/${Utils.buildOriginalPath(params.teamId, params.boardId, params.viewId, params.cardId)}`
    } else if (props.pathType === "") {
        originalPath = `/${Utils.buildOriginalPath('', params.boardId, params.viewId, params.cardId)}`
    }

    if (loggedIn === false) {
        if (originalPath) {
            let redirectUrl = '/' + Utils.buildURL(originalPath)
            if (redirectUrl.indexOf('//') === 0) {
                redirectUrl = redirectUrl.slice(1)
            }
            const loginUrl = `/error?id=not-logged-in&r=${encodeURIComponent(redirectUrl)}`
            return <Navigate to={loginUrl} replace/>
        }
        return <Navigate to='/error?id=not-logged-in' replace/>
    }

    if (!props.skipWelcome && Utils.isFocalboardPlugin() && (me?.id !== 'single-user') && loggedIn === true && !me?.props[UserPropPrefix + UserSettingKey.WelcomePageViewed]) {
        if (originalPath) {
            return <Navigate to={`/welcome?r=${originalPath}`} replace/>
        }
        return <Navigate to='/welcome' replace/>
    }

    return props.children || null
}

type WelcomeRedirectProps = {
    children?: React.ReactElement
    getOriginalPath?: (params: any) => string
}

function WelcomeRedirect(props: WelcomeRedirectProps): React.ReactNode {
    const loggedIn = useAppSelector<boolean|null>(getLoggedIn)
    const params = useParams<any>()

    let originalPath
    if (props.getOriginalPath) {
        originalPath = props.getOriginalPath(params)
    }


    return props.children
}

type RouterWithHistoryProps = {
    basename: string
    history: History
    children: React.ReactNode
}

const RouterWithHistory = ({basename, children, history}: RouterWithHistoryProps): JSX.Element => {
    const [state, setState] = React.useState({
      action: history.action,
      location: history.location,
    });

    React.useLayoutEffect(() => history.listen(setState), [history]);

    return (
      <Router
        basename={basename}
        children={children}
        location={state.location}
        navigationType={state.action}
        navigator={history}
      />
    )
}

type Props = {
    history?: History
}

const FocalboardRouter = (props: Props): JSX.Element => {
    const isPlugin = Utils.isFocalboardPlugin()

    let browserHistory: History
    if (props.history) {
        browserHistory = props.history
    } else {
        browserHistory = useMemo(() => {
            return createBrowserHistory()
        }, [])
    }

    if (isPlugin) {
        useEffect(() => {
            if (window.frontendBaseURL) {
                browserHistory.replace(window.location.pathname.replace(window.frontendBaseURL, ''))
            }
        }, [])
    }

    return (
        <RouterWithHistory
            basename={Utils.getFrontendBaseURL()}
            history={browserHistory}
        >
            <GlobalErrorRedirect/>
            <Routes>
                {isPlugin && <Route path='/' element={<LoginRequired skipWelcome={true}><HomeToCurrentTeam/></LoginRequired>}/>}

                <Route path='/error' element={<ErrorPage/>}/>

                {isPlugin && <Route path='/welcome' element={<LoginRequired skipWelcome={true}><WelcomePage/></LoginRequired>}/>}
                {!isPlugin && <Route path='/login' element={<LoginPage/>}/>}
                {!isPlugin && <Route path='/register' element={<RegisterPage/>} />}
                {!isPlugin && <Route path='/change_password' element={<ChangePasswordPage/>}/>}

                <Route path='/shared/' element={<BoardPage readonly={true}/>} />
                <Route path='/shared/:boardId' element={<BoardPage readonly={true}/>} />
                <Route path='/shared/:boardId/:viewId' element={<BoardPage readonly={true}/>} />
                <Route path='/shared/:boardId/:viewId/:cardId' element={<BoardPage readonly={true}/>} />

                <Route path='/board/' element={<LoginRequired pathType='board'><BoardPage/></LoginRequired>}/>
                <Route path='/board/:boardId/' element={<LoginRequired pathType='board'><BoardPage/></LoginRequired>}/>
                <Route path='/board/:boardId/:viewId' element={<LoginRequired pathType='board'><BoardPage/></LoginRequired>}/>
                <Route path='/board/:boardId/:viewId/:cardId' element={<LoginRequired pathType='board'><BoardPage/></LoginRequired>}/>

                <Route path='/workspace/:workspaceId/' element={<WorkspaceToTeamRedirect/>} />
                <Route path='/workspace/:workspaceId/:boardId' element={<WorkspaceToTeamRedirect/>} />
                <Route path='/workspace/:workspaceId/:boardId/:viewId' element={<WorkspaceToTeamRedirect/>} />
                <Route path='/workspace/:workspaceId/:boardId/:viewId/:cardId' element={<WorkspaceToTeamRedirect/>} />
                <Route path='/workspace/:workspaceId/shared/' element={<WorkspaceToTeamRedirect/>} />
                <Route path='/workspace/:workspaceId/shared/:boardId' element={<WorkspaceToTeamRedirect/>} />
                <Route path='/workspace/:workspaceId/shared/:boardId/:viewId' element={<WorkspaceToTeamRedirect/>} />
                <Route path='/workspace/:workspaceId/shared/:boardId/:viewId/:cardId' element={<WorkspaceToTeamRedirect/>} />

                <Route path='/team/:teamId/' element={<LoginRequired pathType='team'><BoardPage/></LoginRequired>}/>
                <Route path='/team/:teamId/:boardId' element={<LoginRequired pathType='team'><BoardPage/></LoginRequired>}/>
                <Route path='/team/:teamId/:boardId/:viewId' element={<LoginRequired pathType='team'><BoardPage/></LoginRequired>}/>
                <Route path='/team/:teamId/:boardId/:viewId/:cardId' element={<LoginRequired pathType='team'><BoardPage/></LoginRequired>}/>

                {!isPlugin && <Route path='/' element={<LoginRequired pathType='board'><BoardPage/></LoginRequired>}/>}
                {!isPlugin && <Route path='/:boardId/' element={<LoginRequired pathType='board'><BoardPage/></LoginRequired>}/>}
                {!isPlugin && <Route path='/:boardId/:viewId' element={<LoginRequired pathType='board'><BoardPage/></LoginRequired>}/>}
                {!isPlugin && <Route path='/:boardId/:viewId/:cardId' element={<LoginRequired pathType='board'><BoardPage/></LoginRequired>}/>}
            </Routes>
        </RouterWithHistory>
    )
}

export default React.memo(FocalboardRouter)
