// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {useEffect} from 'react'
import {generatePath, useNavigate, useParams} from 'react-router-dom'

import {getCurrentBoardId} from '../../store/boards'
import {setCurrent as setCurrentView, getCurrentBoardViews} from '../../store/views'
import {useAppSelector, useAppDispatch} from '../../store/hooks'
import {UserSettings} from '../../userSettings'
import {getSidebarCategories} from '../../store/sidebar'
import {useCurrentRoutePath} from '../../hooks/router'

const TeamToBoardAndViewRedirect = (): null => {
    const boardId = useAppSelector(getCurrentBoardId)
    const boardViews = useAppSelector(getCurrentBoardViews)
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const params = useParams<{boardId: string, viewId: string, cardId?: string, teamId?: string}>()
    const path = useCurrentRoutePath()
    const categories = useAppSelector(getSidebarCategories)
    const teamId = params.teamId || UserSettings.lastTeamId || '0'

    useEffect(() => {
        let boardID = params.boardId || ''
        if (!params.boardId) {
            // first preference is for last visited board
            boardID = UserSettings.lastBoardId[teamId]

            // if last visited board is unavailable, use the first board in categories list
            if (!boardID && categories.length > 0) {
                // a category may exist without any boards.
                // find the first category with a board and pick it's first board
                const categoryWithBoards = categories.find((category) => category.blockIDs.length > 0)

                // there may even be no boards at all
                if (categoryWithBoards) {
                    boardID = categoryWithBoards.blockIDs[0]
                }
            }

            if (boardID) {
                const newPath = generatePath(path, {...params, boardId: boardID, viewID: undefined})
                navigate(newPath, {replace: true})

                // return from here because the loadBoardData() call
                // will fetch the data to be used below. We'll
                // use it in the next render cycle.
                return
            }
        }

        let viewID = params.viewId

        // when a view isn't open,
        // but the data is available, try opening a view
        if ((!viewID || viewID === '0') && boardId && boardId === params.boardId && boardViews && boardViews.length > 0) {
            // most recent view gets the first preference
            viewID = UserSettings.lastViewId[boardID]
            if (viewID) {
                UserSettings.setLastViewId(boardID, viewID)
                dispatch(setCurrentView(viewID))
            } else if (boardViews.length > 0) {
                // if most recent view is unavailable, pick the first view
                viewID = boardViews[0].id
                UserSettings.setLastViewId(boardID, viewID)
                dispatch(setCurrentView(viewID))
            }

            if (viewID) {
                const newPath = generatePath(path, {...params, viewId: viewID})
                navigate(newPath, {replace: true})
            }
        }
    }, [teamId, params.boardId, params.viewId, categories.length, boardViews.length, boardId])

    return null
}

export default TeamToBoardAndViewRedirect
