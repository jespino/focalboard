// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {FilterClause, FilterCondition} from '../../blocks/filterClause'
import {FilterGroup} from '../../blocks/filterGroup'
import {Board} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import {Utils} from '../../utils'
import Button from '../../widgets/buttons/button'

import Modal from '../modal'

import FilterEntry from './filterEntry'

import './filterComponent.scss'

type Props = {
    board: Board
    activeView: BoardView
    onClose: () => void
}

const FilterComponent = React.memo((props: Props): JSX.Element => {
    const conditionClicked = (optionId: string, filter: FilterClause): void => {
        const {activeView} = props

        const filterIndex = activeView.filter.filters.indexOf(filter)
        Utils.assert(filterIndex >= 0, "Can't find filter")

        const filterGroup = new FilterGroup(activeView.filter)
        const newFilter = filterGroup.filters[filterIndex] as FilterClause

        Utils.assert(newFilter, `No filter at index ${filterIndex}`)
        if (newFilter.condition !== optionId) {
            newFilter.condition = optionId as FilterCondition
            mutator.changeViewFilter(activeView, filterGroup)
        }
    }

    const addFilterClicked = () => {
        const {board, activeView} = props

        const filters = activeView.filter?.filters.filter((o) => !FilterGroup.isAnInstanceOf(o)) as FilterClause[] || []
        const filterGroup = new FilterGroup(activeView.filter)
        const filter = new FilterClause()

        // Pick the first select property that isn't already filtered on
        const selectProperty = board.cardProperties.
            filter((o) => !filters.find((f) => f.propertyId === o.id)).
            find((o) => o.type === 'select' || o.type === 'multiSelect')
        if (selectProperty) {
            filter.propertyId = selectProperty.id
        }
        filterGroup.filters.push(filter)

        mutator.changeViewFilter(activeView, filterGroup)
    }

    const {board, activeView} = props

    // TODO: Handle FilterGroups (compound filter statements)
    const filters: FilterClause[] = activeView.filter?.filters.filter((o) => !FilterGroup.isAnInstanceOf(o)) as FilterClause[] || []

    return (
        <Modal
            onClose={props.onClose}
        >
            <div
                className='FilterComponent'
            >
                {filters.map((filter) => (
                    <FilterEntry
                        key={`${filter.propertyId}-${filter.condition}-${filter.values.join(',')}`}
                        board={board}
                        view={activeView}
                        conditionClicked={conditionClicked}
                        filter={filter}
                    />
                ))}

                <br/>

                <Button onClick={() => addFilterClicked()}>
                    <FormattedMessage
                        id='FilterComponent.add-filter'
                        defaultMessage='+ Add filter'
                    />
                </Button>
            </div>
        </Modal>
    )
})

export default FilterComponent
