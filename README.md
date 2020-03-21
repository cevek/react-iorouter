# react-iorouter
[![MinGzip](https://badgen.net/bundlephobia/minzip/react-iorouter)](https://bundlephobia.com/result?p=react-iorouter)

Simple small react router with typed routes and SSR support

## Features

🔥 100% Typed

🚀 React hooks

⚡️️ 2.8kb gzipped

🦄 Isomorphic (SSR support)

💎 Scroll restoration

🎹 Optional query parameters

## Example

```tsx
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {createRoute, Router, Route, Link, useRedirect} from 'react-iorouter';

export const routes = {
    index: createRoute<{tab?: string}>('/'),
    todos: createRoute('/todos'),
    editTodo: createRoute<{id: string}>('/todo/edit/:id'),
};

function App() {
    return (
        <Router>
            <div>
                <Link route={routes.index} params={{}}>
                    go to index
                </Link>
            </div>
            <div>
                <Link route={routes.todos} params={{}}>
                    go to todos
                </Link>
            </div>
            <Route route={routes.todos}>
                <Todos />
            </Route>
            <Route route={routes.editTodo}>{params => <EditTodo id={params.id} />}</Route>
        </Router>
    );
}
function Todos() {
    const todos = [
        {id: '1', name: 'foo'},
        {id: '2', name: 'bar'},
    ];
    return (
        <div>
            {todos.map(todo => (
                <div key={todo.id}>
                    {todo.name}{' '}
                    <Link route={routes.editTodo} params={{id: todo.id}}>
                        Edit
                    </Link>
                </div>
            ))}
        </div>
    );
}

function EditTodo(props: {id: string}) {
    const redirect = useRedirect();
    const save = async () => {
        // await api.saveTodo({name});
        redirect(routes.todos, {});
    };
    return (
        <div>
            <input />
            <button onClick={save}>Save</button>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
```
