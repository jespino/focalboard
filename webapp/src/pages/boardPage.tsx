// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useCallback, useState} from 'react'
import {batch} from 'react-redux'
import {FormattedMessage} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'
import {useHotkeys} from 'react-hotkeys-hook'

import {IBlock} from '../blocks/block'
import {ContentBlock} from '../blocks/contentBlock'
import {CommentBlock} from '../blocks/commentBlock'
import {Board} from '../blocks/board'
import {Card} from '../blocks/card'
import {BoardView} from '../blocks/boardView'
import {sendFlashMessage} from '../components/flashMessages'
import Workspace from '../components/workspace'
import mutator from '../mutator'
import octoClient from '../octoClient'
import {Utils} from '../utils'
import wsClient, {WSClient} from '../wsclient'
import './boardPage.scss'
import {updateBoards, getCurrentBoard, setCurrent as setCurrentBoard} from '../store/boards'
import {updateViews, getCurrentView, setCurrent as setCurrentView} from '../store/views'
import {updateCards} from '../store/cards'
import {updateContents} from '../store/contents'
import {updateComments} from '../store/comments'
import {initialLoad} from '../store/initialLoad'
import {useAppSelector, useAppDispatch} from '../store/hooks'

type Props = {
    readonly?: boolean
}

const BoardPage = (props: Props) => {
    const board = useAppSelector(getCurrentBoard)
    const activeView = useAppSelector(getCurrentView)
    const dispatch = useAppDispatch()

    const history = useHistory()
    const match = useRouteMatch<{boardId: string, viewId: string, workspaceId?: string}>()
    const [websocketClosed, setWebsocketClosed] = useState(false)

    // TODO: Make this less brittle. This only works because this is the root render function
    useEffect(() => {
        octoClient.workspaceId = match.params.workspaceId || '0'
    }, [match.params.workspaceId])

    // Backward compatibility: This can be removed in the future, this is for
    // transform the old query params into routes
    useEffect(() => {
        const queryString = new URLSearchParams(window.location.search)
        const queryBoardId = queryString.get('id')
        const queryViewId = queryString.get('v')
        if (queryBoardId) {
            const params = {...match.params, boardId: queryBoardId}
            if (queryViewId) {
                params.viewId = queryViewId
            }
            const newPath = generatePath(match.path, params)
            history.push(newPath)
        }
    }, [])

    useEffect(() => {
        if (!match.params.boardId) {
            // Load last viewed boardView
            const boardId = localStorage.getItem('lastBoardId') || undefined
            const viewId = localStorage.getItem('lastViewId') || undefined
            if (boardId) {
                const newPath = generatePath(match.path, {...match.params, boardId, viewId})
                history.push(newPath)
            }
        }
    }, [])

    const attachToBoard = useCallback((boardId?: string, viewId = '') => {
        Utils.log(`attachToBoard: ${boardId}`)
        localStorage.setItem('lastBoardId', boardId || '')
        localStorage.setItem('lastViewId', viewId)
        dispatch(setCurrentBoard(boardId || ''))
        dispatch(setCurrentView(viewId || ''))

        if (!boardId) {
            history.push('/')
        }
    }, [match.path, match.params, history])

    useEffect(() => {
        attachToBoard(match.params.boardId, match.params.viewId)
    }, [match.params.boardId, match.params.viewId])

    useEffect(() => {
        Utils.setFavicon(board?.fields.icon)
    }, [board?.fields.icon])

    useEffect(() => {
        if (board) {
            let title = `${board.title}`
            if (activeView?.title) {
                title += ` | ${activeView.title}`
            }
            document.title = title
        } else {
            document.title = 'Focalboard'
        }
    }, [board?.title, activeView?.title])

    useEffect(() => {
        if (!props.readonly) {
            dispatch(initialLoad)
            const token = localStorage.getItem('focalboardSessionId') || ''
            wsClient.authenticate(match.params.workspaceId || '0', token)
            wsClient.subscribeToWorkspace(match.params.workspaceId || '0')
        }

        dispatch(initialLoad())

        const token = localStorage.getItem('focalboardSessionId') || ''
        wsClient.authenticate(match.params.workspaceId || '0', token)
        wsClient.subscribeToWorkspace(match.params.workspaceId || '0')

        const incrementalUpdate = (_: WSClient, blocks: IBlock[]) => {
            batch(() => {
                dispatch(updateBoards(blocks.filter((b: IBlock) => b.type === 'board' || b.deleteAt !== 0) as Board[]))
                dispatch(updateViews(blocks.filter((b: IBlock) => b.type === 'view' || b.deleteAt !== 0) as BoardView[]))
                dispatch(updateCards(blocks.filter((b: IBlock) => b.type === 'card' || b.deleteAt !== 0) as Card[]))
                dispatch(updateComments(blocks.filter((b: IBlock) => b.type === 'comment' || b.deleteAt !== 0) as CommentBlock[]))
                dispatch(updateContents(blocks.filter((b: IBlock) => b.type !== 'card' && b.type !== 'view' && b.type !== 'board' && b.type !== 'comment') as ContentBlock[]))
            })
        }
        const updateWebsocketState = (_: WSClient, newState: 'init'|'open'|'close'): void => {
            if (newState === 'open') {
                const newToken = localStorage.getItem('focalboardSessionId') || ''
                wsClient.authenticate(match.params.workspaceId || '0', newToken)
                wsClient.subscribeToWorkspace(match.params.workspaceId || '0')
            }
            setWebsocketClosed(newState === 'close')
        }
        wsClient.addOnChange(incrementalUpdate)
        wsClient.addOnReconnect(() => dispatch(initialLoad))
        wsClient.addOnStateChange(updateWebsocketState)
        return () => {
            wsClient.unsubscribeToWorkspace(match.params.workspaceId || '0')
            wsClient.removeOnChange(incrementalUpdate)
            wsClient.removeOnReconnect(() => dispatch(initialLoad))
            wsClient.removeOnStateChange(updateWebsocketState)
        }
    }, [match.params.workspaceId, props.readonly])

    useHotkeys('ctrl+z,cmd+z', () => {
        Utils.log('Undo')
        if (mutator.canUndo) {
            const description = mutator.undoDescription
            mutator.undo().then(() => {
                if (description) {
                    sendFlashMessage({content: `Undo ${description}`, severity: 'low'})
                } else {
                    sendFlashMessage({content: 'Undo', severity: 'low'})
                }
            })
        } else {
            sendFlashMessage({content: 'Nothing to Undo', severity: 'low'})
        }
    })

    useHotkeys('shift+ctrl+z,shift+cmd+z', () => {
        Utils.log('Redo')
        if (mutator.canRedo) {
            const description = mutator.redoDescription
            mutator.redo().then(() => {
                if (description) {
                    sendFlashMessage({content: `Redo ${description}`, severity: 'low'})
                } else {
                    sendFlashMessage({content: 'Redu', severity: 'low'})
                }
            })
        } else {
            sendFlashMessage({content: 'Nothing to Redo', severity: 'low'})
        }
    })

    return (
        <div className='BoardPage'>
            {websocketClosed &&
                <div className='WSConnection error'>
                    <a
                        href='https://www.focalboard.com/fwlink/websocket-connect-error.html'
                        target='_blank'
                        rel='noreferrer'
                    >
                        <FormattedMessage
                            id='Error.websocket-closed'
                            defaultMessage='Websocket connection closed, connection interrupted. If this persists, check your server or web proxy configuration.'
                        />
                    </a>
                </div>}
            <Workspace readonly={props.readonly || false}/>
        </div>
    )
}

export default BoardPage
