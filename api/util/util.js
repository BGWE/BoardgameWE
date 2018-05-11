

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