// Self-check for the optional-variants rules in routes/api/product.js.
// Mirrors the two decisions the routes make: which variants to persist, and
// whether the duplicate-name guard rejects the payload.
const assert = require('assert');

// as in POST /add and PUT /update/:id
const resolveVariants = ({ variants, price, images }) => {
  let out = Array.isArray(variants) ? variants : [];
  if (out.length === 0 && (price !== undefined || (images && images.length))) {
    out = [{ name: 'Default', price: price !== undefined ? Number(price) : 0, isDefault: true, images: images || [] }];
  }
  return out;
};

const hasDuplicateNames = list => {
  const names = list.map((v, i) => (v.color || v.name || (list.length === 1 ? 'Default' : `Option ${i + 1}`)).trim().toLowerCase());
  return new Set(names).size !== names.length;
};

// 1. Variants optional: empty / absent / null all persist as []
assert.deepStrictEqual(resolveVariants({ variants: [] }), [], 'empty array stays empty');
assert.deepStrictEqual(resolveVariants({}), [], 'absent variants -> []');
assert.deepStrictEqual(resolveVariants({ variants: null }), [], 'null variants -> []');
assert.deepStrictEqual(resolveVariants({ variants: 'nonsense' }), [], 'non-array -> []');

// 2. ...and an empty list never trips the duplicate-name validation
assert.equal(hasDuplicateNames(resolveVariants({ variants: [] })), false, 'empty list is valid');

// 3. Legacy top-level price/images still synthesise a Default variant
assert.equal(resolveVariants({ variants: [], price: 250 })[0].price, 250, 'legacy price kept');
assert.equal(resolveVariants({ images: ['a.png'] })[0].images.length, 1, 'legacy images kept');
assert.equal(resolveVariants({ variants: [], price: 0 }).length, 1, 'price 0 is still a price');

// 4. Supplied variants pass through untouched, duplicates still rejected
const two = [{ color: 'Red' }, { color: 'Blue' }];
assert.deepStrictEqual(resolveVariants({ variants: two, price: 99 }), two, 'explicit variants win over legacy price');
assert.equal(hasDuplicateNames(two), false, 'distinct colors ok');
assert.equal(hasDuplicateNames([{ color: 'Red' }, { color: ' red ' }]), true, 'duplicates still caught');

console.log('optional-variant checks passed');
