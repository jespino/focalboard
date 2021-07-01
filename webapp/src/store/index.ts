// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {configureStore} from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import {all} from 'redux-saga/effects'

import {reducer as currentUserReducer, currentUserSaga} from './currentUser'
import {reducer as currentWorkspaceReducer, currentWorkspaceSaga} from './currentWorkspace'
import {reducer as currentWorkspaceUsersReducer, currentWorkspaceUsersSaga} from './currentWorkspaceUsers'
import {reducer as languageReducer, fetchLanguageSaga, storeLanguageSaga} from './language'

const sagaMiddleware = createSagaMiddleware()
function* rootSaga() {
    yield all([
        currentUserSaga(),
        fetchLanguageSaga(),
        storeLanguageSaga(),
        currentWorkspaceUsersSaga(),
        currentWorkspaceSaga(),
    ])
}

const store = configureStore({
    reducer: {
        currentUser: currentUserReducer,
        currentWorkspace: currentWorkspaceReducer,
        currentWorkspaceUsers: currentWorkspaceUsersReducer,
        language: languageReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({thunk: false}).concat(sagaMiddleware),
})
sagaMiddleware.run(rootSaga)

export default store

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
