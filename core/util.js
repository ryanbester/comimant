/*
Copyright (C) 2019-2020 Bester Intranet
*/

const get_tld = () => {
    if(process.env.NODE_ENV == 'development'){
        return "dev";
    } else {
        return "com";
    }
}

const url_rewrite = (host, url) => {
    var newUrl;

    if(url.startsWith('/accounts/')){
        if(host == 'accounts.besterintranet.' + get_tld()){
            url = url.replace('/accounts', '');
            newUrl = host + url;
        }
    }
    
    if(newUrl === undefined){
        return host + url;
    }

    return newUrl;
}

module.exports = {
    get_tld: get_tld,
    url_rewrite: url_rewrite
};