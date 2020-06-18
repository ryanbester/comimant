/*
 * Copyright (C) 2019 - 2020 Comimant
 */

const timeout = (ms, promise) => {
    return new Promise((resolve, reject) => {
        setTimeout(_ => {
            reject(new Error('timeout'));
        }, ms);

        promise.then(resolve, reject);
    });
};

const navigateWithoutRefresh = (url, title, state) => {
    if (window.history.pushState) {
        window.history.pushState(state, title, url);
    } else {
        if (state !== undefined) {
            let params = new URLSearchParams(state).toString();
            window.location.href = url + '?' + params;
        } else {
            window.location.href = url;
        }
    }
};
