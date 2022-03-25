// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {render, screen, waitFor} from '@testing-library/react'

import {Router} from 'react-router-dom'

import {Provider as ReduxProvider} from 'react-redux'

import userEvent from '@testing-library/user-event'

import configureStore from 'redux-mock-store'
import {MemoryRouter} from 'react-router-dom'

import {mocked} from 'ts-jest/utils'

import thunk from 'redux-thunk'

import {wrapIntl} from '../../testUtils'

import mutator from '../../mutator'

import octoClient from '../../octoClient'

import {IUser} from '../../user'

import WelcomePage from './welcomePage'

const w = (window as any)
const oldBaseURL = w.baseURL

jest.mock('../../mutator')
const mockedMutator = mocked(mutator, true)

jest.mock('../../octoClient')
const mockedOctoClient = mocked(octoClient, true)

const mockedNavigate = jest.fn();
let mockedSearchParamsGet = jest.fn();

jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom')

    return {
        ...originalModule,
        useNavigate: () => mockedNavigate,
        useSearchParams: () => [{get: mockedSearchParamsGet}],
    }
})


beforeEach(() => {
    jest.resetAllMocks()
    mockedMutator.patchUserConfig.mockImplementation(() => Promise.resolve({
        welcomePageViewed: '1',
    }))
    mockedOctoClient.prepareOnboarding.mockResolvedValue({
        teamID: 'team_id_1',
        boardID: 'board_id_1',
    })
})

afterEach(() => {
    w.baseURL = oldBaseURL
})

describe('pages/welcome', () => {
    const mockStore = configureStore([thunk])
    const store = mockStore({
        teams: {
            current: {id: 'team_id_1'},
        },
        users: {
            me: {
                props: {},
            },
        },
    })

    test('Welcome Page shows Explore Page', () => {
        const {container} = render(wrapIntl(
            <ReduxProvider store={store}>
                <WelcomePage/>
            </ReduxProvider>
        ), {wrapper: MemoryRouter})

        expect(screen.getByText('Take a tour')).toBeDefined()
        expect(container).toMatchSnapshot()
    })

    test('Welcome Page shows Explore Page with subpath', () => {
        w.baseURL = '/subpath'

        const {container} = render(wrapIntl(
            <ReduxProvider store={store}>
                <WelcomePage/>
            </ReduxProvider>
        ), {wrapper: MemoryRouter})

        expect(screen.getByText('Take a tour')).toBeDefined()
        expect(container).toMatchSnapshot()
    })

    test('Welcome Page shows Explore Page And Then Proceeds after Clicking Explore', async () => {
        const component = render(wrapIntl(
            <ReduxProvider store={store}>
                <WelcomePage/>
            </ReduxProvider>
        ), {wrapper: MemoryRouter})

        const exploreButton = screen.getByText('No thanks, I\'ll figure it out myself')
        expect(exploreButton).toBeDefined()
        userEvent.click(exploreButton)
        await waitFor(() => {
            expect(mockedNavigate).toBeCalledWith('/team/team_id_1', {replace: true})
            expect(mockedMutator.patchUserConfig).toBeCalledTimes(1)
        })
    })

    test('Welcome Page does not render explore page the second time we visit it', async () => {
        const customStore = mockStore({
            teams: {
                current: {id: 'team_id_1'},
            },
            users: {
                me: {
                    props: {
                        focalboard_welcomePageViewed: '1',
                    },
                },
            },
        })

        const component = render(wrapIntl(
            <ReduxProvider store={customStore}>
                <WelcomePage/>
            </ReduxProvider>
        ), {wrapper: MemoryRouter})

        await waitFor(() => {
            expect(mockedNavigate).toBeCalledWith('/team/team_id_1', {replace: true})
        })
    })

    test('Welcome Page redirects us when we have a r query parameter with welcomePageViewed set to true', async () => {
        mockedSearchParamsGet = jest.fn(() => '123')

        const customStore = mockStore({
            teams: {
                current: {id: 'team_id_1'},
            },
            users: {
                me: {
                    props: {
                        focalboard_welcomePageViewed: '1',
                    },
                },
            },
        })
        const component = render(wrapIntl(
            <ReduxProvider store={customStore}>
                <WelcomePage/>
            </ReduxProvider>
        ), {wrapper: MemoryRouter})

        await waitFor(() => {
            expect(mockedNavigate).toBeCalledWith('123', {replace: true})
        })
    })

    test('Welcome Page redirects us when we have a r query parameter with welcomePageViewed set to null', async () => {
        mockedSearchParamsGet = jest.fn(() => '123')

        const localStore = mockStore({
            teams: {
                current: {id: 'team_id_1'},
            },
            users: {
                me: {
                    props: {},
                },
            },
        })

        const component = render(wrapIntl(
            <ReduxProvider store={localStore}>
                <WelcomePage/>
            </ReduxProvider>
        ), {wrapper: MemoryRouter})
        const exploreButton = screen.getByText('No thanks, I\'ll figure it out myself')
        expect(exploreButton).toBeDefined()
        userEvent.click(exploreButton)
        await waitFor(() => {
            expect(mockedNavigate).toBeCalledWith('123', {replace: true})
            expect(mockedMutator.patchUserConfig).toBeCalledTimes(1)
        })
    })

    test('Welcome page starts tour on clicking Take a tour button', async () => {
        const user = {
            props: {
                focalboard_welcomePageViewed: '1',
                focalboard_onboardingTourStep: '0',
                focalboard_tourCategory: 'onboarding',
            },
        } as unknown as IUser
        mockedOctoClient.getMe.mockResolvedValue(user)

        const component = render(wrapIntl(
            <ReduxProvider store={store}>
                <WelcomePage/>
            </ReduxProvider>
        ), {wrapper: MemoryRouter})
        const exploreButton = screen.getByText('Take a tour')
        expect(exploreButton).toBeDefined()
        userEvent.click(exploreButton)
        await waitFor(() => expect(mockedOctoClient.prepareOnboarding).toBeCalledTimes(1))
        await waitFor(() => expect(mockedNavigate).toBeCalledWith('/team/team_id_1/board_id_1', {replace: true}))
    })

    test('Welcome page skips tour on clicking no thanks option', async () => {
        const user = {
            props: {
                focalboard_welcomePageViewed: '1',
                focalboard_onboardingTourStep: '0',
                focalboard_tourCategory: 'onboarding',
            },
        } as unknown as IUser
        mockedOctoClient.getMe.mockResolvedValue(user)

        const component = render(wrapIntl(
            <ReduxProvider store={store}>
                <WelcomePage/>
            </ReduxProvider>
        ), {wrapper: MemoryRouter})
        const exploreButton = screen.getByText('No thanks, I\'ll figure it out myself')
        expect(exploreButton).toBeDefined()
        userEvent.click(exploreButton)
        await waitFor(() => expect(mockedNavigate).toBeCalledWith('/team/team_id_1', {replace: true}))
    })
})
