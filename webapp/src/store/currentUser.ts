// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, Action, PayloadAction} from '@reduxjs/toolkit'
import {takeEvery, put, call, StrictEffect} from 'redux-saga/effects'

import {default as client} from '../octoClient'
import {IUser} from '../user'

import {RootState} from './index'

const currentUserSlice = createSlice({
    name: 'currentUser',
    initialState: {value: null} as {value: IUser|null},
    reducers: {
        setUser: (state, action: PayloadAction<IUser>) => {
            state.value = action.payload
        },
    },
})

export const {setUser} = currentUserSlice.actions
export const {reducer} = currentUserSlice

function* fetchCurrentUserGen(): Generator<StrictEffect> {
    const user = yield call(client.getMe.bind(client))
    if (user) {
        yield put(setUser(user as IUser))
    }
}

export function* currentUserSaga(): Generator<StrictEffect> {
    yield takeEvery('currentUser/fetch', fetchCurrentUserGen)
}

export function getCurrentUser(state: RootState): IUser|null {
    return state.currentUser.value
}

export function fetchCurrentUser(): Action {
    return {type: 'currentUser/fetch'}
}
