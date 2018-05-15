

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

exports.rank = (data, score_fn, lower_better) => {
    let copy = data.slice(0);
    copy.sort((a, b) => (lower_better ? -1 : 1) * (score_fn(b) - score_fn(a)));

    const best_rank = copy.length > 0 ? copy[0].rank : 0;
    let prev_rank = null,
        prev_natu_rank = 0,
        prev_skip_rank = 0;

    for (let i = 0; i < copy.length; ++i) {
        if (prev_rank !== copy[i].rank) {
            prev_skip_rank = i + 1;
            prev_natu_rank = prev_natu_rank + 1;
        }
        copy[i].score = score_fn(copy[i]);
        copy[i].natural_rank = prev_natu_rank;
        copy[i].rank = copy[i].natural_rank;
        copy[i].skip_rank = prev_skip_rank;
        copy[i].win = copy[i].rank === best_rank;
    }
    return copy;
};