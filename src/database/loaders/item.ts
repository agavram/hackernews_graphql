import { ref, get, child } from "firebase/database"
import { database } from "../firebase"
import Dataloader from "dataloader"

export async function getItemRaw(id: number) {
    const itemsRef = ref(database, "v0/item")
    const itemRef = child(itemsRef, String(id))
    const item = await get(itemRef)
    return item.val()
}

export async function getItem(id: number) {
    const item = await getItemRaw(id)
    if (!item) {
        throw new Error(`No item found with id: ${id}`)
    }
    return {
        id: item.id,
        title: item.title,
        url: item.url,
        createdAt: new Date(item.time * 1000).toISOString(),
        text: item.text,
        children_ids: item.kids,
        score: item.score,
        dead: item.dead,
        by: item.by,
        deleted: item.deleted,
        descendants: item.descendants,
        poll: item.poll,
        parent_id: item.parent,
        parts: item.parts,
        type: item.type?.toUpperCase(),
    }
}


export async function getItems(ids: readonly number[]) {
    const items = await Promise.all(ids.map(async id => {
        try {
            const item = await getItem(id)
            return item
        } catch (error: any) {
            return new Error(error?.message)
        }
    }))
    return items
}

export const itemLoader = new Dataloader(getItems)
