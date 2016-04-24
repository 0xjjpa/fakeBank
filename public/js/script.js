"use strict";

console.log('model started');

var TheM = TheM || {};
TheM.loading = 0;
TheM.loadingWhat = [];


TheM.doLoad = function () {
    //loads objects from the localStorage
    if (!TheM.user || !TheM.user.id || !TheM.user.isAuthenticated || !LZString) return false;
    return TheM.accounts.doLoad() && TheM.cards.doLoad() && TheM.fxrates.doLoad() && TheM.beneficiaries.doLoad() && TheM.restrictions.doLoad();
};

TheM.doSave = function () {
    //saves savable objects into the localStorage
    if (!TheM.user || !TheM.user.id || !LZString) return false;
    return TheM.accounts.doSave() && TheM.cards.doSave() && TheM.fxrates.doSave() && TheM.beneficiaries.doSave() && TheM.restrictions.doSave();
};

TheM.refresh = function () {
    //emits eventModelUpdate event to refresh the screen
    document.dispatchEvent(new Event('eventModelUpdate'));
};
