import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { describe, beforeAll, afterAll, beforeEach, it } from 'vitest';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-avalon',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore Rules - Security & Functional Tests', () => {
  
  // 1. Users Collection
  describe('Users', () => {
    it('should allow user to read their own data', async () => {
      const alice = testEnv.authenticatedContext('alice', { email: 'alice@example.com' });
      await assertSucceeds(alice.firestore().collection('users').doc('alice').get());
    });

    it('should allow staff to delete user data', async () => {
      const staff = testEnv.authenticatedContext('caue', { email: 'caue.nanda.tavares@gmail.com' });
      await assertSucceeds(staff.firestore().collection('users').doc('alice').delete());
    });

    it('should deny non-staff to delete user data', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await assertFails(alice.firestore().collection('users').doc('alice').delete());
    });

    it('should allow updating own Profile without updatedAt', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await assertSucceeds(alice.firestore().collection('users').doc('alice').update({ lastActivityAt: new Date() }));
    });
    
    it('should fail to update other users profile', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await assertFails(alice.firestore().collection('users').doc('bob').update({ username: 'Hacked' }));
    });
  });

  describe('Favorites', () => {
    it('should allow reading favorites if signed in', async () => {
       const alice = testEnv.authenticatedContext('alice');
       await assertSucceeds(alice.firestore().collection('users').doc('bob').collection('favorites').doc('characters').collection('items').get());
    });

    it('should allow user to create their own favorite', async () => {
       const alice = testEnv.authenticatedContext('alice');
       await assertSucceeds(alice.firestore().collection('users').doc('alice').collection('favorites').doc('characters').collection('items').doc('char1').set({ id: 1, name: 'Waifu' }));
    });

    it('should deny user to create favorite for another user', async () => {
       const alice = testEnv.authenticatedContext('alice');
       await assertFails(alice.firestore().collection('users').doc('bob').collection('favorites').doc('characters').collection('items').doc('char1').set({ id: 1, name: 'Waifu' }));
    });
  });

  // 2. Friend Requests
  describe('Friend Requests', () => {
    it('should allow user to create friend request where they are sender', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await assertSucceeds(alice.firestore().collection('friendRequests').doc('req1').set({ from: 'alice', to: 'bob' }));
    });

    it('should fail if user tries to spoof sender', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await assertFails(alice.firestore().collection('friendRequests').doc('req1').set({ from: 'malicious', to: 'bob' }));
    });
  });

  // 3. Counters (Increment Check)
  describe('Counters', () => {
    it('should allow incrementing counter', async () => {
      const alice = testEnv.authenticatedContext('alice');
      // Assume counter exists
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('counters').doc('users').set({ count: 10 });
      });
      await assertSucceeds(alice.firestore().collection('counters').doc('users').update({ count: 11 }));
    });
    
    it('should fail if decrementing counter improperly', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('counters').doc('users').set({ count: 10 });
      });
      await assertFails(alice.firestore().collection('counters').doc('users').update({ count: 9 }));
    });
    
    it('should allow staff to rewrite counter', async () => {
      const staff = testEnv.authenticatedContext('caue', { email: 'caue.nanda.tavares@gmail.com' });
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('counters').doc('users').set({ count: 10 });
      });
      await assertSucceeds(staff.firestore().collection('counters').doc('users').update({ count: 1 }));
    });
  });
  
  // 4. Chats and Messages Validation
  describe('Chats & Messages (Relational Test)', () => {
    it('should allow creation if participant', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await assertSucceeds(alice.firestore().collection('chats').doc('chat1').set({ participants: ['alice', 'bob'] }));
    });

    it('should allow participant to post message', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('chats').doc('chat1').set({ participants: ['alice', 'bob'] });
      });
      await assertSucceeds(alice.firestore().collection('chats').doc('chat1').collection('messages').doc('msg1').set({ senderId: 'alice' }));
    });

    it('should fail to post message if not in chat', async () => {
      const eve = testEnv.authenticatedContext('eve');
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('chats').doc('chat1').set({ participants: ['alice', 'bob'] });
      });
      await assertFails(eve.firestore().collection('chats').doc('chat1').collection('messages').doc('msg1').set({ senderId: 'eve' }));
    });
  });
});
