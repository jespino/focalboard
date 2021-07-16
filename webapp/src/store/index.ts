// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {configureStore} from '@reduxjs/toolkit'

import {reducer as currentUserReducer} from './currentUser'
import {reducer as currentWorkspaceReducer} from './currentWorkspace'
import {reducer as currentWorkspaceUsersReducer} from './currentWorkspaceUsers'
import {reducer as languageReducer} from './language'
import {reducer as globalTemplatesReducer} from './globalTemplates'
import {reducer as boardsReducer} from './boards'
import {reducer as viewsReducer} from './views'

const store = configureStore({
    reducer: {
        currentUser: currentUserReducer,
        currentWorkspace: currentWorkspaceReducer,
        currentWorkspaceUsers: currentWorkspaceUsersReducer,
        language: languageReducer,
        globalTemplates: globalTemplatesReducer,
        boards: boardsReducer,
        views: viewsReducer,
    },
})

export default store

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
