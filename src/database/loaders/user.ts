import { ref, get, child } from "firebase/database"
import { database } from "../firebase"
import Dataloader from "dataloader"

export async function getUserRaw(username: string) {
    const usersRef = ref(database, "/v0/user")
    const userRef = child(usersRef, username)
    const user = await get(userRef)
    return user.val()
}

export async function getUser(username: string) {
    const user = await getUserRaw(username)
    if (!user) {
        throw new Error(`No user found with username: ${username}`)
    }
    return {
        username: user.id,
        createdAt: new Date(user.created * 1000).toISOString(),
        submission_ids: user.submitted,
        about: user.about,
        karma: user.karma
    }
}

export async function getUsers(usernames: readonly string[]) {
    const users = await Promise.all(usernames.map(async username => {
        try {
            const user = await getUser(username)
            return user
        } catch (error: any) {
            return new Error(error?.message)
        }
    }))
    return users
}

export const userLoader = new Dataloader(getUsers)
