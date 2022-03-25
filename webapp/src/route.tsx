// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {
    Navigate,
    Route,
    useParams,
} from 'react-router-dom'

import {Utils} from './utils'
import {getLoggedIn, getMe} from './store/users'
import {useAppSelector} from './store/hooks'
import {UserSettingKey} from './userSettings'
import {IUser, UserPropPrefix} from './user'

type RouteProps = {
    path: string
    element?: React.ReactElement
    children?: React.ReactElement
    getOriginalPath?: (params: any) => string
    loginRequired?: boolean
}

function FBRoute(props: RouteProps) {
    const loggedIn = useAppSelector<boolean|null>(getLoggedIn)
    const params = useParams<any>()
    const me = useAppSelector<IUser|null>(getMe)

    let originalPath
    if (props.getOriginalPath) {
        originalPath = props.getOriginalPath(params)
    }

    if (Utils.isFocalboardPlugin() && (me?.id !== 'single-user') && props.path !== '/welcome' && loggedIn === true && !me?.props[UserPropPrefix + UserSettingKey.WelcomePageViewed]) {
        if (originalPath) {
            return <Navigate to={`/welcome?r=${originalPath}`} replace/>
        }
        return <Navigate to='/welcome' replace/>
    }

    if (loggedIn === false && props.loginRequired) {
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

    if (loggedIn === true || !props.loginRequired) {
        return (
            <Route
                path={props.path}
                element={props.element}
            >
                {props.children}
            </Route>
        )
    }
    return null
}

export default React.memo(FBRoute)
