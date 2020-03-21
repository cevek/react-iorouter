import {Key, parse, regexpToFunction, tokensToFunction, tokensToRegexp} from 'path-to-regexp';
import * as React from 'react';

export type Route<Params extends object> = {
    path: string;
    matchUrl: (url: Url) => Params | null;
    testUrl: (path: string) => boolean;
    toUrl: (params: Params) => string;
};

export function createRoute<Params extends object>(path: string): Route<Params> {
    const keys: Key[] = [];
    const tokens = parse(path);
    const re = tokensToRegexp(tokens, keys);
    const _match = regexpToFunction<Params>(re, keys, {decode: decodeURIComponent});
    const _toUrl = tokensToFunction<Params>(tokens, {encode: encodeURIComponent});
    const requiredFields = new Set(
        tokens
            .map(token => (typeof token !== 'string' ? String(token.name) : undefined))
            .filter((t): t is string => t !== undefined),
    );
    const matchUrl = (url: Url) => {
        const m = _match(url.path);
        if (m === false) {
            return null;
        }
        const params = m.params;
        url.query.split('&').forEach(p => {
            const r = p.split('=');
            const key = decodeURIComponent(r[0]) as never;
            const val = decodeURIComponent(r[1]) as never;
            if (!(key in params)) {
                params[key] = val;
            }
        });
        return params;
    };
    const testUrl = (path: string) => {
        return _match(path) !== false;
    };
    const toUrl = (params: Params) => {
        let query = '';
        for (const key in params) {
            if (!requiredFields.has(key)) {
                query += `${encodeURIComponent(key)}=${encodeURIComponent((params[key] as unknown) as string)}`;
            }
        }
        return _toUrl(params) + (query === '' ? '' : `?${query}`);
    };
    return {
        path: path,
        matchUrl: matchUrl,
        testUrl: testUrl,
        toUrl: toUrl,
    };
}

export type Router = {
    url: Url;
    push: (url: string) => void;
    replace: (url: string) => void;
};

export type Url = {
    path: string;
    query: string;
    state: object | undefined;
};
const createUrl = (): Url => ({
    path: window.location.pathname,
    query: window.location.search.substr(1),
    state: window.history.state,
});
export const Router = React.memo(function Router(props: {
    initialUrl?: string;
    children: React.ReactNode;
    scrollRestoration?: boolean;
    onBeforeNextUrl?: (url: string) => object;
    onAfterNextUrl?: (url: string) => object;
    onBackForward?: (url: string) => object;
}) {
    const {children, initialUrl, onBeforeNextUrl, onAfterNextUrl, onBackForward, scrollRestoration = true} = props;
    const defaultUrl = (): Url => {
        if (initialUrl === undefined) {
            return createUrl();
        }
        const p = initialUrl.split('?');
        return {
            path: p[0],
            query: p[1] || '',
            state: undefined,
        };
    };
    const [url, setUrl] = React.useState(defaultUrl);
    const [fromBackForward, setBackForwardState] = React.useState(false);
    const change = (type: 'pushState' | 'replaceState') => (url: string) => {
        if (typeof window === 'object') {
            const state = onBeforeNextUrl && onBeforeNextUrl(url);
            window.history[type](state, '', url);
            onAfterNextUrl && onAfterNextUrl(url);
            setUrl(createUrl());
            setBackForwardState(false);
        }
    };
    const router: Router = {
        push: change('pushState'),
        replace: change('replaceState'),
        url: url,
    };
    React.useEffect(() => {
        if (scrollRestoration) {
            window.history.scrollRestoration = 'auto';
        }
        const fn = () => {
            onBackForward && onBackForward(window.location.href);
            setUrl(createUrl());
            setBackForwardState(true);
        };
        window.addEventListener('popstate', fn);
        return () => window.removeEventListener('popstate', fn);
    }, []);

    React.useLayoutEffect(() => {
        if (!fromBackForward && scrollRestoration) {
            window.scrollTo(0, 0);
        }
    }, [fromBackForward, scrollRestoration]);
    return <routerContext.Provider value={router}>{children}</routerContext.Provider>;
});

export const routerContext = React.createContext<Router>(null!);

export function Route<Params extends object>(props: {
    route: Route<Params>;
    children: React.ReactNode | ((params: Params) => React.ReactNode);
}) {
    const {children, route} = props;
    const router = React.useContext(routerContext);
    if (typeof children === 'function') {
        const res = route.matchUrl(router.url);
        if (res !== null) {
            return <>{children(res)}</>;
        }
        return null;
    }
    if (route.testUrl(router.url.path)) {
        return <>{children}</>;
    }
    return null;
}

export function Link<Params extends object>(props: {
    route: Route<Params>;
    params: Params;
    className?: string;
    children: React.ReactNode;
}) {
    const {children, params, route} = props;
    const router = React.useContext(routerContext);
    const url = route.toUrl(params);
    return (
        <a
            href={url}
            className={props.className}
            onClick={e => {
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    return router.push(url);
                }
            }}>
            {children}
        </a>
    );
}

export function useRedirect() {
    const router = React.useContext(routerContext);
    return <Params extends object>(route: Route<Params>, params: Params) => {
        const url = route.toUrl(params);
        router.push(url);
    };
}
