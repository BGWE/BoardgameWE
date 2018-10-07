

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

    const best_score = copy.length > 0 ? copy[0].score : 0;
    let prev_score = null,
        prev_natu_rank = 0,
        prev_skip_rank = 0;

    for (let i = 0; i < copy.length; ++i) {
        if (prev_score !== copy[i].score) {
            prev_skip_rank = i + 1;
            prev_natu_rank = prev_natu_rank + 1;
            prev_score = copy[i].score;
        }
        copy[i].score = score_fn(copy[i]);
        copy[i].natural_rank = prev_natu_rank;
        copy[i].rank = copy[i].natural_rank;
        copy[i].skip_rank = prev_skip_rank;
        copy[i].win = copy[i].score === best_score;
    }
    return copy;
};

exports.unique = (data) => {
    data = data.slice(0);
    data.sort();
    let outputData = [];
    for (let i = 0; i < data.length; ++i) {
        if (outputData.length === 0 || data[i] !== outputData[outputData.length - 1]) {
            outputData.push(data[i]);
        }
    }
    return outputData;
};

exports.rankPlayersFromData = (dict, aggregate) => {
    let scores = [];
    for (let _key in dict.players) {
        if (!dict.players.hasOwnProperty(_key)) { continue; }
        scores.push({
            score: dict.points[_key].length === 0 ? 0 : aggregate(dict.points[_key]),
            player: dict.players[_key]
        })
    }
    return exports.rank(scores, (player) => player.score, false);
};

exports.sendModelOrError = function(promise, res, objName) {
    return promise
        .then(obj => {
            let body = {};
            body[objName] = obj;
            res.status(200).send(body);
        })
        .catch(err => {
            res.status(500).send({error: "err"});
        })
};