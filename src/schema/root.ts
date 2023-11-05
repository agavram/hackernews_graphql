import { queryType, stringArg, subscriptionType, nonNull, list, intArg } from "nexus"
import { User, Item, StoryPageEnum } from "./models"
import { userLoader, itemLoader, storyPageLoader } from "../database/loaders/mod"
import { GraphQLInt } from "graphql"

export const Query = queryType({
    definition(t) {
        t.string("ping", {
            resolve: () => `Pong!, current time is ${new Date().toISOString()}`
        })
        t.field("user", {
            type: User,
            args: {
                username: nonNull(stringArg({
                    description: "username of the user."
                })),
            },
            async resolve(root, { username }, ctx) {
                const user = await userLoader.load(username)
                return user
            }
        })

        t.field("item", {
            type: Item,
            args: {
                id: nonNull(intArg())
            },
            async resolve(root, { id }, ctx) {
                const item = await itemLoader.load(id)
                return item
            }

        })

        t.field("storyPage", {
            type: list(GraphQLInt),
            args: {
                name: nonNull(StoryPageEnum)
            },
            async resolve(root, { name }, ctx) {
                return storyPageLoader.load(name)
            }
        })
    }
})


export const Subscribe = subscriptionType({
    definition(t) {
        t.boolean('truths', {
            subscribe() {
                return (async function* () {
                    while (true) {
                        await new Promise(res => setTimeout(res, 1000))
                        yield Math.random() > 0.5
                    }
                })()
            },
            resolve(eventData: boolean | null) {
                return eventData
            },
        })
    }
})
