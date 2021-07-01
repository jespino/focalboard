// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, Action, PayloadAction} from '@reduxjs/toolkit'
import {takeEvery, put, call, StrictEffect} from 'redux-saga/effects'

import {default as client} from '../octoClient'
import {IUser} from '../user'

import {RootState} from './index'

const currentWorkspaceUsersSlice = createSlice({
    name: 'currentWorkspaceUsers',
    initialState: {list: [], byId: {}} as {list: IUser[], byId: {[key: string]: IUser}},
    reducers: {
        setWorkspaceUsers: (state, action: PayloadAction<Array<IUser>>) => {
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

function* fetchCurrentWorkspaceUsersGen(): Generator<StrictEffect> {
    const workspaceUsers = yield call(client.getWorkspaceUsers.bind(client))
    if (workspaceUsers) {
        yield put(setWorkspaceUsers(workspaceUsers as IUser[]))
    }
}

export function* currentWorkspaceUsersSaga(): Generator<StrictEffect> {
    yield takeEvery('currentWorkspaceUsers/fetch', fetchCurrentWorkspaceUsersGen)
}


export function getCurrentWorkspaceUsers(state: RootState): IUser[] {
    return state.currentWorkspaceUsers.list
}

export function getCurrentWorkspaceUsersById(state: RootState): {[key: string]: IUser} {
    return state.currentWorkspaceUsers.byId
}

export function fetchCurrentWorkspaceUsers(): Action {
    return {type: 'currentWorkspaceUsers/fetch'}
}
