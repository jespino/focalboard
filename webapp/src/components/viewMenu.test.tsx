// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import '@testing-library/jest-dom'
import {render} from '@testing-library/react'
import 'isomorphic-fetch'

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {MemoryRouter} from 'react-router-dom'

import configureStore from 'redux-mock-store'

import {FetchMock} from '../test/fetchMock'
import {TestBlockFactory} from '../test/testBlockFactory'
import {wrapDNDIntl} from '../testUtils'

import ViewMenu from './viewMenu'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

describe('/components/viewMenu', () => {
    const board = TestBlockFactory.createBoard()
    const boardView = TestBlockFactory.createBoardView(board)
    const tableView = TestBlockFactory.createTableView(board)
    const activeView = boardView
    const views = [boardView, tableView]

    const card = TestBlockFactory.createCard(board)
    activeView.fields.viewType = 'table'
    activeView.fields.groupById = undefined
    activeView.fields.visiblePropertyIds = ['property1', 'property2']

    const state = {
        users: {
            me: {
                id: 'user-id-1',
                username: 'username_1',
            },
        },
        searchText: {},
        teams: {
            current: {id: 'team-id'},
        },
        boards: {
            current: board.id,
            boards: {
                [board.id]: board,
            },
            myBoardMemberships: {
                [board.id]: {userId: 'user_id_1', schemeAdmin: true},
            },
        },
        cards: {
            templates: [card],
        },
        views: {
            views: {
                boardView: activeView,
            },
            current: 'boardView',
        },
        clientConfig: {},
    }

    it('should match snapshot', () => {
        const mockStore = configureStore([])
        const store = mockStore(state)

        const container = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <ViewMenu
                    board={board}
                    activeView={activeView}
                    views={views}
                    readonly={false}
                />
            </ReduxProvider>,
        ), {wrapper: MemoryRouter})

        expect(container).toMatchSnapshot()
    })

    it('should match snapshot, read only', () => {
        const mockStore = configureStore([])
        const store = mockStore(state)

        const container = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <ViewMenu
                    board={board}
                    activeView={activeView}
                    views={views}
                    readonly={true}
                />
            </ReduxProvider>,
        ), {wrapper: MemoryRouter})

        expect(container).toMatchSnapshot()
    })
})
