import { ref, get, child } from "firebase/database"
import { database } from "../firebase"
import Dataloader from "dataloader"
import { getStoryPagePath } from "../util"

export async function getStoryPageRaw(name: string) {
    const rootRef = ref(database, "/v0")
    const storyPagePath = getStoryPagePath(name)
    const storyPageRef = child(rootRef, storyPagePath)
    const storyPage = await get(storyPageRef)
    return storyPage.val()
}

export async function getStoryPage(name: string) {
    const page = await getStoryPageRaw(name)
    return page
}

export async function getStoryPages(names: readonly string[]) {
    const pages = await Promise.all(names.map(async name => {
        try {
            const page = await getStoryPage(name)
            return page
        } catch (error: any) {
            return new Error(error?.message)
        }
    }))
    return pages
}

export const storyPageLoader = new Dataloader(getStoryPages)
