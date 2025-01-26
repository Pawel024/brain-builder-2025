function groupByIds(ids) {
    return ids.reduce((acc, id) => {
        const level = Math.floor(id / 10);
        const challenge = id % 10;
        if (!acc[level]) {
            acc[level] = [];
        }
        acc[level].push(challenge);
        return acc;
    }, {});
}

function groupByIndex(vars, ids, groupedIds = null) {
    if (!groupedIds) {
        groupedIds = groupByIds(ids);
    }
    const groupedVars = {};
    for (const level in groupedIds) {
        groupedVars[level] = groupedIds[level].map(challenge => {
            const id = parseInt(level) * 10 + challenge;
            const index = ids.indexOf(id);
            return vars[index];
        });
    }
    return groupedVars;
}

export { groupByIds, groupByIndex };
