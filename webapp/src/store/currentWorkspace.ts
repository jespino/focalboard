// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, Action, PayloadAction} from '@reduxjs/toolkit'
import {Epic} from 'redux-observable'
import {filter, mergeMap} from 'rxjs/operators'

import {default as client} from '../octoClient'
import {OctoUtils} from '../octoUtils'
import {IWorkspace} from '../blocks/workspace'
import {Board} from '../blocks/board'
import {BoardView} from '../blocks/boardView'
import {MutableWorkspaceTree, WorkspaceTree} from '../viewModel/workspaceTree'
import {IUser} from '../user'

import {RootState} from './index'

type CurrentWorkspace = {
    workspace: IWorkspace|null,
    tree: WorkspaceTree|null,
    users: {
        list: IUser[],
        byId: {
            [key: string]: IUser
        }
    }
}

const currentWorkspaceSlice = createSlice({
    name: 'currentWorkspace',
    initialState: {
        workspace: null,
        tree: null,
        users: {
            list: [],
            byId: {},
        },
    },
    reducers: {
        setWorkspace: (state: CurrentWorkspace, action: PayloadAction<IWorkspace|null>) => {
            state.workspace = action.payload
        },
        setWorkspaceTree: (state: CurrentWorkspace, action: PayloadAction<WorkspaceTree|null>) => {
            state.tree = action.payload
        },
        setWorkspaceUsers: (state: CurrentWorkspace, action: PayloadAction<IUser[]>) => {
            state.users.list = action.payload || []
            state.users.byId = action.payload.reduce((acc: {[key: string]: IUser}, user: IUser) => {
                acc[user.id] = user
                return acc
            }, {})
        },
    },
})

export const {setWorkspace, setWorkspaceTree, setWorkspaceUsers} = currentWorkspaceSlice.actions
export const {reducer} = currentWorkspaceSlice

export const currentWorkspaceEpic: Epic<Action, PayloadAction<IWorkspace|null>> = (action$) => action$.pipe(
    filter((action: Action) => action.type === 'currentWorkspace/fetch'),
    mergeMap(async () => {
        const workspace = await client.getWorkspace()
        return setWorkspace(workspace || null)
    }),
)

export const currentWorkspaceTreeEpic: Epic<Action, PayloadAction<WorkspaceTree|null>> = (action$) => action$.pipe(
    filter((action: Action) => action.type === 'currentWorkspace/fetchTree'),
    mergeMap(async () => {
        const rawBoards = await client.getBlocksWithType('board')
        const rawViews = await client.getBlocksWithType('view')
        const rawBlocks = [...rawBoards, ...rawViews]

        const blocks = OctoUtils.hydrateBlocks(rawBlocks)

        const workspaceTree = new MutableWorkspaceTree()
        const allBoards = blocks.filter((block) => block.type === 'board') as Board[]
        workspaceTree.boards = allBoards.filter((block) => !block.isTemplate).
            sort((a, b) => a.title.localeCompare(b.title)) as Board[]
        workspaceTree.boardTemplates = allBoards.filter((block) => block.isTemplate).
            sort((a, b) => a.title.localeCompare(b.title)) as Board[]
        workspaceTree.views = blocks.filter((block) => block.type === 'view').
            sort((a, b) => a.title.localeCompare(b.title)) as BoardView[]

        return setWorkspaceTree(workspaceTree || null)
    }),
)

export const currentWorkspaceUsersEpic: Epic<Action, PayloadAction<IUser[]>> = (action$) => action$.pipe(
    filter((action: Action) => action.type === 'currentWorkspaceUsers/fetch'),
    mergeMap(async () => {
        const users = await client.getWorkspaceUsers()
        return setWorkspaceUsers(users || [])
    }),
)

export function getCurrentWorkspace(state: RootState): IWorkspace|null {
    return state.currentWorkspace.workspace
}

export function getCurrentWorkspaceTree(state: RootState): IWorkspace|null {
    return state.currentWorkspace.tree
}

export function getCurrentWorkspaceUsers(state: RootState): IUser[] {
    return state.currentWorkspace.users.list
}

export function getCurrentWorkspaceUsersById(state: RootState): {[key: string]: IUser} {
    return state.currentWorkspace.users.byId
}

export function fetchCurrentWorkspace(): Action {
    return {type: 'currentWorkspace/fetch'}
}

export function fetchCurrentWorkspaceUsers(): Action {
    return {type: 'currentWorkspace/fetchUsers'}
}

export function fetchCurrentWorkspaceTree(): Action {
    return {type: 'currentWorkspace/fetchTree'}
}
