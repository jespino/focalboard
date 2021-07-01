// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, Action, PayloadAction} from '@reduxjs/toolkit'
import {takeEvery, put, call, StrictEffect} from 'redux-saga/effects'

import {default as client} from '../octoClient'
import {IWorkspace} from '../blocks/workspace'

import {RootState} from './index'

const currentWorkspaceSlice = createSlice({
    name: 'currentWorkspace',
    initialState: {value: null} as {value: IWorkspace|null},
    reducers: {
        setWorkspace: (state, action: PayloadAction<IWorkspace>) => {
            state.value = action.payload
        },
    },
})

export const {setWorkspace} = currentWorkspaceSlice.actions
export const {reducer} = currentWorkspaceSlice

function* fetchCurrentWorkspaceGen(): Generator<StrictEffect> {
    const workspace = yield call(client.getWorkspace.bind(client))
    if (workspace) {
        yield put(setWorkspace(workspace as IWorkspace))
    }
}

export function* currentWorkspaceSaga(): Generator<StrictEffect> {
    yield takeEvery('currentWorkspace/fetch', fetchCurrentWorkspaceGen)
}

export function getCurrentWorkspace(state: RootState): IWorkspace|null {
    return state.currentWorkspace.value
}

export function fetchCurrentWorkspace(): Action {
    return {type: 'currentWorkspace/fetch'}
}
