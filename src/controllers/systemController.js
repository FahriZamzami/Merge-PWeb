exports.showMaintenance = (req, res) => {
  res.render('maintenance', { title: 'Maintenance' });
};

exports.showMatikan = (req, res) => {
  res.render('matikan', { title: 'Matikan Website' });
};