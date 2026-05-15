"use client";

export default function InventoryPanel({ ownedIds, allItems }) {
  const owned = allItems.filter((i) => ownedIds.includes(i.id));

  if (owned.length === 0) return null;

  return (
    <div className="nes-container is-dark with-title">
      <p className="title nes-text text-xs">Envanter</p>
      <ul className="flex flex-wrap gap-3">
        {owned.map((item) => (
          <li key={item.id} className="nes-container is-rounded is-dark p-2">
            <span className="nes-text" style={{ fontSize: "0.55rem" }}>
              {item.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
