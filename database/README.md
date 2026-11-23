# NEFRAVA catalog

`nefrava.categories.json` and `nefrava.items.json` are MongoDB Extended JSON arrays. The item `categoryId` values reference the category `$oid` values in the categories file.

## Recommended setup

Back up any database that contains the old botanical catalog. For a clean start, point `backend/.env` at a new database named `nefrava`, then run `npm run seed` from `backend/`. The seeder validates the references, creates menu indexes, and upserts by the stable `_id` values. It does not delete existing documents.

For direct imports with MongoDB Database Tools, import categories first and then items, using `--jsonArray --mode=upsert --upsertFields=_id`. The seeder is preferred because it also creates the menu indexes and validates category references.

Legacy botanical records are not deleted by the menu import. Public menu queries require an active restaurant category, so legacy categories without `isActive: true` remain out of the public menu.

## Menu item fields

- `name` and `description`: English and Arabic strings.
- `price`: sample price in EGP; `currency` is `EGP`.
- `categoryId`: MongoDB ObjectId reference to `categories`.
- `photo`: existing upload filename, or an empty string until a dish photo is added.
- `isAvailable`: controls ordering and the public availability label.
- `isFeatured`: marks house favourites.
- `createdAt` and `updatedAt`: BSON dates.
