// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {ReactNode} from 'react'

import './boardSwitcherDialog.scss'
import {useIntl} from 'react-intl'

import {generatePath, useNavigate, useParams, useLocation, useMatch} from 'react-router-dom'

import octoClient from '../../octoClient'
import SearchDialog from '../searchDialog/searchDialog'
import Globe from '../../widgets/icons/globe'
import LockOutline from '../../widgets/icons/lockOutline'
import {useAppSelector} from '../../store/hooks'
import {useCurrentRoutePath} from '../../hooks/router'
import {getCurrentTeam} from '../../store/teams'
import {getMe} from '../../store/users'
import {BoardTypeOpen, BoardTypePrivate} from '../../blocks/board'

type Props = {
    onClose: () => void
}

const BoardSwitcherDialog = (props: Props): JSX.Element => {
    const intl = useIntl()
    const team = useAppSelector(getCurrentTeam)
    const me = useAppSelector(getMe)
    const title = intl.formatMessage({id: 'FindBoardsDialog.Title', defaultMessage: 'Find Boards'})
    const subTitle = intl.formatMessage(
        {
            id: 'FindBoardsDialog.SubTitle',
            defaultMessage: 'Type to find a board. Use <b>UP/DOWN</b> to browse. <b>ENTER</b> to select, <b>ESC</b> to dismiss',
        },
        {
            b: (...chunks) => <b>{chunks}</b>,
        },
    )

    const params = useParams<{boardId: string, viewId: string, cardId?: string}>()
    const path = useCurrentRoutePath();
    const navigate = useNavigate()

    const selectBoard = async (boardId: string): Promise<void> => {
        if (!me) {
            return
        }
        const newPath = generatePath(path, {...params, boardId, viewId: undefined})
        navigate(newPath)
        props.onClose()
    }

    const searchHandler = async (query: string): Promise<Array<ReactNode>> => {
        if (query.trim().length === 0 || !team) {
            return []
        }

        const items = await octoClient.search(team.id, query)
        const untitledBoardTitle = intl.formatMessage({id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled Board'})
        return items.map((item) => (
            <div
                key={item.id}
                className='blockSearchResult'
                onClick={() => selectBoard(item.id)}
            >
                {item.type === BoardTypeOpen && <Globe/>}
                {item.type === BoardTypePrivate && <LockOutline/>}
                <span>{item.title || untitledBoardTitle}</span>
            </div>
        ))
    }

    return (
        <SearchDialog
            onClose={props.onClose}
            title={title}
            subTitle={subTitle}
            searchHandler={searchHandler}
        />
    )
}

export default BoardSwitcherDialog
