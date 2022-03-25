// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useMemo} from 'react'
import {
    Router,
    Navigate,
    Routes,
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
import {setGlobalError, getGlobalError} from './store/globalError'
import {useAppSelector, useAppDispatch} from './store/hooks'
import {getFirstTeam, fetchTeams, Team} from './store/teams'
import {UserSettings} from './userSettings'
import FBRoute from './route'

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
            return <Navigate to={`/team/${teamID}/${lastBoardID}/${lastViewID}`} replace/>
        }
        if (lastBoardID) {
            return <Navigate to={`/team/${teamID}/${lastBoardID}`} replace/>
        }
    }

    return <Navigate to={`/team/${teamID}`} replace/>
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
                {isPlugin &&
                    <FBRoute
                        path='/'
                        loginRequired={true}
                    >
                        <HomeToCurrentTeam/>
                    </FBRoute>}
                {isPlugin &&
                    <FBRoute path='/welcome'>
                        <WelcomePage/>
                    </FBRoute>}

                <FBRoute path='/error'>
                    <ErrorPage/>
                </FBRoute>

                {!isPlugin &&
                    <FBRoute path='/login'>
                        <LoginPage/>
                    </FBRoute>}
                {!isPlugin &&
                    <FBRoute path='/register'>
                        <RegisterPage/>
                    </FBRoute>}
                {!isPlugin &&
                    <FBRoute path='/change_password'>
                        <ChangePasswordPage/>
                    </FBRoute>}

                <FBRoute path='/shared/:boardId?/:viewId?/:cardId?'>
                    <BoardPage readonly={true}/>
                </FBRoute>
                <FBRoute
                    loginRequired={true}
                    path='/board/:boardId?/:viewId?/:cardId?'
                    getOriginalPath={({boardId, viewId, cardId}) => {
                        return `/board/${Utils.buildOriginalPath('', boardId, viewId, cardId)}`
                    }}
                >
                    <BoardPage/>
                </FBRoute>
                <FBRoute path='/workspace/:workspaceId/:boardId?/:viewId?/:cardId?'>
                    <WorkspaceToTeamRedirect/>
                </FBRoute>
                <FBRoute path='/workspace/:workspaceId/shared/:boardId?/:viewId?/:cardId?'>
                    <WorkspaceToTeamRedirect/>
                </FBRoute>
                <FBRoute
                    loginRequired={true}
                    path='/team/:teamId/:boardId?/:viewId?/:cardId?'
                    getOriginalPath={({teamId, boardId, viewId, cardId}) => {
                        return `/team/${Utils.buildOriginalPath(teamId, boardId, viewId, cardId)}`
                    }}
                >
                    <BoardPage/>
                </FBRoute>

                {!isPlugin &&
                    <FBRoute
                        path='/:boardId?/:viewId?/:cardId?'
                        loginRequired={true}
                        getOriginalPath={({boardId, viewId, cardId}) => {
                            const boardIdIsValidUUIDV4 = UUID_REGEX.test(boardId || '')
                            if (boardIdIsValidUUIDV4) {
                                return `/${Utils.buildOriginalPath('', boardId, viewId, cardId)}`
                            }
                            return ''
                        }}
                    >
                        <BoardPage/>
                    </FBRoute>}
            </Routes>
        </RouterWithHistory>
    )
}

export default React.memo(FocalboardRouter)
