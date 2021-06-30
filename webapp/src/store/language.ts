// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, Action, PayloadAction} from '@reduxjs/toolkit'
import {Epic} from 'redux-observable'
import {filter, mergeMap} from 'rxjs/operators'

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
const {setLanguage} = languageSlice.actions

export const fetchLanguageEpic: Epic<Action, PayloadAction<string>> = (action$) => action$.pipe(
    filter((action: Action) => action.type === 'language/fetch'),
    mergeMap(async () => {
        const language = getCurrentLanguage()
        return setLanguage(language)
    }),
)

export const storeLanguageEpic: Epic<PayloadAction<string>, PayloadAction<string>> = (action$) => action$.pipe(
    filter((action) => action.type === 'language/store'),
    mergeMap(async (action: PayloadAction<string>) => {
        i18nStoreLanguage(action.payload)
        return setLanguage(action.payload)
    }),
)

export function getLanguage(state: RootState): string {
    return state.language.value
}

export function storeLanguage(lang: string): PayloadAction<string> {
    return {type: 'language/store', payload: lang}
}

export function fetchLanguage(): Action {
    return {type: 'language/fetch'}
}
