/**
 * Group ids by level
 * 
 * @param {number[]} ids
 * 
 * @returns {object} An object with the ids grouped by level
 */
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


/**
 * Group vars by index
 * 
 * @param {object[]} vars
 * @param {number[]} ids
 * @param {object} groupedIds
 * 
 * @returns {object} An object with the vars grouped by level
 */
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
