// src/mocks/handlers.ts
import { rest } from 'msw'
import type { RestRequest, ResponseComposition, RestContext } from 'msw'

export const handlers = [
  rest.post(
    '/api/login',
    async (
      req: RestRequest,
      res: ResponseComposition,
      ctx: RestContext
    ) => {
      const { email, password } = await req.json()

      if (email === 'test@example.com' && password === '123456') {
        const fakeToken = 'fake-jwt-token.abc.def'
        return res(
          ctx.status(200),
          ctx.json({
            token: fakeToken,
            user: { id: 1, name: 'Anna Schmidt', email, xp: 120 },
          })
        )
      } else {
        return res(
          ctx.status(401),
          ctx.json({ message: 'Invalid credentials' })
        )
      }
    }
  ),
]
