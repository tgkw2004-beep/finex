import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: {
        schema: 'public'
    },
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
})

// Helper function to query remote schemas
// PostgREST requires the schema to be specified via headers
export function queryRemoteSchema(schema: string) {
    return createClient(supabaseUrl, supabaseAnonKey, {
        db: {
            schema: schema
        },
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
        global: {
            headers: {
                'Accept-Profile': schema,
                'Content-Profile': schema,
            }
        }
    })
}
