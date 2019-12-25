/*
Copyright (C) 2019 Bester Intranet
*/

function resizeGridItem(item) {
    var grid = document.getElementsByClassName("home-page-grid-container")[0];
    var rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
    var rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap'));

    var height = 100;
    var rowSpan = Math.ceil(height / (rowHeight + rowGap));

    item.style.gridRowEnd = "span " + rowSpan;
}

function resizeAllGridItems() {
    var allItems = document.getElementsByClassName("home-page-grid-container__widget");
    
    Array.prototype.forEach.call(allItems, function(item) {
        resizeGridItem(item);
    });
}

$(document).ready(_ => {
    resizeAllGridItems();
});

window.addEventListener("resize", resizeAllGridItems);