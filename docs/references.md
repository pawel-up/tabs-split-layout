# A Note About References

After a transaction completes, the references to objects created during the transaction are invalid. It means, the transaction items do not reference the manager's state and should not be used to read or manipulate the state.

For example.

```typescript
const tx = layout.transaction();
const root = tx.add();
const p1 = root.addPanel({ key: 'p1' });
const p2 = root.addPanel({ key: 'p2' });
const i1 = p1.addItem({ key: 'i1' });
const i2 = p2.addItem({ key: 'i2' });
tx.commit();

StateHelper.removeItem(layout, i1.key);
```

This snippet creates a root panel, adds two panels to the root panel, and adds an item to each. After that the item 1 is removed using the `StateHelper`.

After these lines are executed, the `p1`, `p2`, `i1`, and `i2` are referencing a state before the `i1` was removed. So that this would result in finding the `i1`:

```typescript
p1.hasItem(i1.key); // -> true
```

But the factual state is that the layout has different state at this point so the following is different:

```typescript
state.panel(p1.key).hasItem(i1.key); // -> false
```

In essence, do not use references created during the transaction after the transaction is done. You can use keys to reference a specific object but you need to be careful with your logic to not access an object that was moved or removed.
