// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, Action, PayloadAction} from '@reduxjs/toolkit'
import {takeEvery, put, StrictEffect} from 'redux-saga/effects'

import {getCurrentLanguage, storeLanguage as i18nStoreLanguage} from '../i18n'

import {RootState} from './index'

const languageSlice = createSlice({
    name: 'language',
    initialState: {value: 'en'} as {value: string},
    reducers: {
        setLanguage: (state, action: PayloadAction<string>) => {
            state.value = action.payload
        },
    },
})

export const {reducer} = languageSlice

export function getLanguage(state: RootState): string {
    return state.language.value
}

function* storeLanguageGen(action: PayloadAction<string>): Generator<StrictEffect> {
    i18nStoreLanguage(action.payload)
    yield put(languageSlice.actions.setLanguage(action.payload))
}

export function* storeLanguageSaga(): Generator<StrictEffect> {
    yield takeEvery('language/store', storeLanguageGen)
}

function* fetchLanguageGen(): Generator<StrictEffect> {
    const lang = getCurrentLanguage()
    yield put(languageSlice.actions.setLanguage(lang))
}

export function* fetchLanguageSaga(): Generator<StrictEffect> {
    yield takeEvery('language/fetch', fetchLanguageGen)
}

export function fetchLanguage(): Action {
    return {type: 'language/fetch'}
}

export function storeLanguage(lang: string): PayloadAction<string> {
    return {type: 'language/store', payload: lang}
}
