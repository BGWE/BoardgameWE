

exports.listToString = (list) => {
    if (list.length === 0) {
        return "";
    }
    let str = list[0];
    for (let i = 1; i < list.length; ++i) {
        str += "," + list[i];
    }
    return str;
};

exports.toDictMapping = (arr, field) => {
    let object = {};
    for (let i in arr) {
        if (!arr.hasOwnProperty(i)) {
            continue;
        }
        let item = arr[i];
        object[item[field]] = item;
    }
    return object;
};