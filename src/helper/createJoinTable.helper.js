const handleCreateJoinTable = (mainTable, joins) => {
  const joinClauses = joins
    .map((join) => {
      const joinType = join.type ? `${join.type} JOIN` : "JOIN";
      return `${joinType} ${join.table} ON ${join.on}`;
    })
    .join(" ");

  return `${mainTable} ${joinClauses}`;
};

module.exports = handleCreateJoinTable;
