const permitKeys = [
  'id',
  'nickname',
  'city',
  'realname',
  'gender',
  'birthday',
  'company',
  'title',
  'bio',
  'avatar_url',
];

module.exports.parse = data => {
  if (typeof data !== 'object') return new Error('Failed to permit profile');

  const result = {};

  permitKeys.forEach(key => {
    if (data[key] !== undefined) result[key] = data[key];
  });

  return result;
};
