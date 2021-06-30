// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction, Action} from '@reduxjs/toolkit'
import {Epic} from 'redux-observable'
import {filter, mergeMap} from 'rxjs/operators'

import {default as client} from '../octoClient'
import {IUser} from '../user'

import {RootState} from './index'

const currentWorkspaceUsersSlice = createSlice({
    name: 'currentWorkspaceUsers',
    initialState: {list: [], byId: {}} as {list: IUser[], byId: {[key: string]: IUser}},
    reducers: {
        setWorkspaceUsers: (state, action: PayloadAction<IUser[]>) => {
            state.list = action.payload || []
            state.byId = action.payload.reduce((acc: {[key: string]: IUser}, user: IUser) => {
                acc[user.id] = user
                return acc
            }, {})
        },
    },
})

export const {setWorkspaceUsers} = currentWorkspaceUsersSlice.actions
export const {reducer} = currentWorkspaceUsersSlice

export const currentWorkspaceUsersEpic: Epic<Action, PayloadAction<IUser[]>> = (action$) => action$.pipe(
    filter((action: Action) => action.type === 'currentWorkspaceUsers/fetch'),
    mergeMap(async () => {
        const users = await client.getWorkspaceUsers()
        return setWorkspaceUsers(users || [])
    }),
)

export function getCurrentWorkspaceUsers(state: RootState): IUser[] {
    return state.currentWorkspaceUsers.list
}

export function getCurrentWorkspaceUsersById(state: RootState): {[key: string]: IUser} {
    return state.currentWorkspaceUsers.byId
}

export function fetchCurrentWorkspaceUsers(): Action {
    return {type: 'currentWorkspaceUsers/fetch'}
}
