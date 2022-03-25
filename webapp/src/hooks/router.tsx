// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useLocation, useMatch} from 'react-router-dom'

export function useCurrentRoutePath(): string {
    const {pathname} = useLocation();
    const path = useMatch(pathname)
    if (path?.pattern) {
        if (typeof path.pattern === 'string') {
            return path.pattern
        }
        return path.pattern.path || ''
    }
    return ''
}

export function usePathType(): string {
    const {pathname} = useLocation();
    const path = useMatch(pathname)
    console.log(pathname)
    if (path?.pattern) {
        if (typeof path.pattern === 'string') {
            return path.pattern
        }
        return path.pattern.path || ''
    }
    return ''
}
