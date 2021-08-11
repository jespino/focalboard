// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect} from 'react'
import {Store, Action} from 'redux'
import {Provider as ReduxProvider} from 'react-redux'
import {useHistory} from 'mm-react-router-dom'

import {GlobalState} from 'mattermost-redux/types/store'
import {getTheme} from 'mattermost-redux/selectors/entities/preferences'
import {getCurrentUserLocale} from 'mattermost-redux/selectors/entities/i18n'

const windowAny = (window as any)
windowAny.baseURL = '/plugins/focalboard'
windowAny.frontendBaseURL = '/boards'
windowAny.isFocalboardPlugin = true
windowAny.mattermostLanguage = 'en'

import App from '../../../webapp/src/app'
import store from '../../../webapp/src/store'
import {storeLanguage, getLanguage} from '../../../webapp/src/store/language'
import GlobalHeader from '../../../webapp/src/components/globalHeader/globalHeader'
import FocalboardIcon from '../../../webapp/src/widgets/icons/logo'
import {setMattermostTheme} from '../../../webapp/src/theme'

import '../../../webapp/src/styles/focalboard-variables.scss'
import '../../../webapp/src/styles/main.scss'
import '../../../webapp/src/styles/labels.scss'

import manifest from './manifest'
import ErrorBoundary from './error_boundary'

// eslint-disable-next-line import/no-unresolved
import {PluginRegistry} from './types/mattermost-webapp'

import './plugin.scss'

const GlobalHeaderIcon = () => {
    return (
        <span className='FocalboardGlobalHeaderIcon'>
            <FocalboardIcon/>
        </span>
    )
}

const MainApp = () => {
    useEffect(() => {
        document.body.classList.add('focalboard-body')
        const root = document.getElementById('root')
        if (root) {
            root.classList.add('focalboard-plugin-root')
        }

        return () => {
            document.body.classList.remove('focalboard-body')
            if (root) {
                root.classList.remove('focalboard-plugin-root')
            }
        }
    }, [])

    return (
        <ErrorBoundary>
            <ReduxProvider store={store}>
                <div id='focalboard-app'>
                    <App/>
                </div>
                <div id='focalboard-root-portal'/>
            </ReduxProvider>
        </ErrorBoundary>
    )
}

const HeaderComponent = () => {
    return (
        <ErrorBoundary>
            <GlobalHeader/>
        </ErrorBoundary>
    )
}

export default class Plugin {
    channelHeaderButtonId?: string
    registry?: PluginRegistry

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    async initialize(registry: PluginRegistry, mmStore: Store<GlobalState, Action<Record<string, unknown>>>): Promise<void> {
        this.registry = registry

        let theme = getTheme(mmStore.getState())
        windowAny.mattermostLanguage = getCurrentUserLocale(mmStore.getState())
        setMattermostTheme(theme)
        mmStore.subscribe(() => {
            const currentTheme = getTheme(mmStore.getState())
            const currentLocale = getCurrentUserLocale(mmStore.getState())
            if (currentTheme !== theme && currentTheme) {
                setMattermostTheme(currentTheme)
                theme = currentTheme
            }
            if (currentLocale !== windowAny.mattermostLanguage && currentLocale) {
                windowAny.mattermostLanguage = currentLocale
                if (getLanguage(store.getState()) === 'mattermost') {
                    store.dispatch(storeLanguage(''))
                    store.dispatch(storeLanguage('mattermost'))
                }
            }
        })

        if (this.registry.registerProduct) {
            windowAny.frontendBaseURL = '/boards'
            const goToFocalboardWorkspace = () => {
                const currentChannel = mmStore.getState().entities.channels.currentChannelId
                window.open(`${window.location.origin}/boards/workspace/${currentChannel}`)
            }
            this.channelHeaderButtonId = registry.registerChannelHeaderButtonAction(<FocalboardIcon/>, goToFocalboardWorkspace, '', 'Focalboard Workspace')

            this.registry.registerCustomRoute('go-to-current-workspace', () => {
                const history = useHistory()
                useEffect(() => {
                    const currentChannel = mmStore.getState().entities.channels.currentChannelId
                    if (currentChannel) {
                        history.push(`/boards/workspace/${currentChannel}`)
                    } else {
                        history.goBack()
                    }
                }, [])
                return <></>
            })
            this.registry.registerProduct('/boards', GlobalHeaderIcon, 'Boards', '/plug/focalboard/go-to-current-workspace', MainApp, HeaderComponent)
        } else {
            windowAny.frontendBaseURL = '/plug/focalboard'
            this.channelHeaderButtonId = registry.registerChannelHeaderButtonAction(<FocalboardIcon/>, () => {
                const currentChannel = mmStore.getState().entities.channels.currentChannelId
                window.open(`${window.location.origin}/plug/focalboard/workspace/${currentChannel}`)
            }, '', 'Focalboard Workspace')
            this.registry.registerCustomRoute('/', MainApp)
        }
    }

    uninitialize(): void {
        if (this.channelHeaderButtonId) {
            this.registry?.unregisterComponent(this.channelHeaderButtonId)
        }
    }
}

declare global {
    interface Window {
        registerPlugin(id: string, plugin: Plugin): void
    }
}

window.registerPlugin(manifest.id, new Plugin())
