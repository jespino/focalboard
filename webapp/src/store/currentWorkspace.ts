// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, Action, PayloadAction} from '@reduxjs/toolkit'
import {Epic} from 'redux-observable'
import {filter, mergeMap} from 'rxjs/operators'

import {default as client} from '../octoClient'
import {IWorkspace} from '../blocks/workspace'

import {RootState} from './index'

const currentWorkspaceSlice = createSlice({
    name: 'currentWorkspace',
    initialState: {value: null} as {value: IWorkspace|null},
    reducers: {
        setWorkspace: (state, action: PayloadAction<IWorkspace|null>) => {
            state.value = action.payload
        },
    },
})

export const {setWorkspace} = currentWorkspaceSlice.actions
export const {reducer} = currentWorkspaceSlice

export const currentWorkspaceEpic: Epic<Action, PayloadAction<IWorkspace|null>> = (action$) => action$.pipe(
    filter((action: Action) => action.type === 'currentWorkspace/fetch'),
    mergeMap(async () => {
        const workspace = await client.getWorkspace()
        return setWorkspace(workspace || null)
    }),
)

export function getCurrentWorkspace(state: RootState): IWorkspace|null {
    return state.currentWorkspace.value
}

export function fetchCurrentWorkspace(): Action {
    return {type: 'currentWorkspace/fetch'}
}
