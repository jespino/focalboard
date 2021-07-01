// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {configureStore} from '@reduxjs/toolkit'
import {createEpicMiddleware, combineEpics} from 'redux-observable'

import {reducer as currentUserReducer, currentUserEpic} from './currentUser'
import {reducer as currentWorkspaceReducer, currentWorkspaceEpic, currentWorkspaceUsersEpic, currentWorkspaceTreeEpic} from './currentWorkspace'
import {reducer as languageReducer, fetchLanguageEpic, storeLanguageEpic} from './language'

const epicMiddleware = createEpicMiddleware()
const epics = combineEpics<any>(
    currentUserEpic,
    fetchLanguageEpic,
    storeLanguageEpic,
    currentWorkspaceUsersEpic,
    currentWorkspaceTreeEpic,
    currentWorkspaceEpic,
)

const store = configureStore({
    reducer: {
        currentUser: currentUserReducer,
        currentWorkspace: currentWorkspaceReducer,
        language: languageReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({thunk: false}).prepend(epicMiddleware),
})
epicMiddleware.run(epics)

export default store

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
