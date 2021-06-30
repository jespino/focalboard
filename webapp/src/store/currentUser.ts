// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, Action, PayloadAction} from '@reduxjs/toolkit'
import {Epic} from 'redux-observable'
import {filter, mergeMap} from 'rxjs/operators'

import {default as client} from '../octoClient'

import {IUser} from '../user'

import {RootState} from './index'

const currentUserSlice = createSlice({
    name: 'currentUser',
    initialState: {value: null} as {value: IUser|null},
    reducers: {
        setUser: (state, action: PayloadAction<IUser|null>) => {
            state.value = action.payload
        },
    },
})

export const {setUser} = currentUserSlice.actions
export const {reducer} = currentUserSlice

export const currentUserEpic: Epic<Action, PayloadAction<IUser|null>> = (action$) => action$.pipe(
    filter((action: Action) => action.type === 'currentUser/fetch'),
    mergeMap(async () => {
        const user = await client.getMe()
        return setUser(user || null)
    }),
)

export function getCurrentUser(state: RootState): IUser|null {
    return state.currentUser.value
}

export function fetchCurrentUser(): Action {
    return {type: 'currentUser/fetch'}
}
