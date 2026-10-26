import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export default function ChatScreen({ route, navigation }) {
  const { conversationId: initialConvId, recipientId, recipientName, propertyId, propertyTitle } = route.params || {};
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState(initialConvId);
  const [chatTitle, setChatTitle] = useState(recipientName || 'Discussion');
  const flatListRef = useRef(null);

  const currentUserId = auth.currentUser?.uid;

  // 1. Gestion dynamique du titre de l'en-tête (Nom du destinataire)
  useEffect(() => {
    if (recipientName) {
      setChatTitle(recipientName);
      navigation.setOptions({ title: recipientName });
      return;
    }

    // Si on a un ID de conversation mais pas de nom direct, on va chercher l'autre participant
    const fetchOtherParticipantName = async () => {
      if (!initialConvId || !currentUserId) return;
      try {
        const convDocRef = doc(db, "conversations", initialConvId);
        const convSnap = await getDoc(convDocRef);
        
        if (convSnap.exists()) {
          const data = convSnap.data();
          const participants = data.participants || [];
          const otherUserId = participants.find(id => id !== currentUserId);

          if (otherUserId) {
            const userSnap = await getDoc(doc(db, "users", otherUserId));
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const name = userData.displayName || userData.nom || userData.prenom || 'Utilisateur';
              setChatTitle(name);
              navigation.setOptions({ title: name });
            }
          }
        }
      } catch (error) {
        console.error("Erreur récupération nom utilisateur :", error);
      }
    };

    fetchOtherParticipantName();
  }, [initialConvId, recipientName]);

  // 2. Écouter les messages de la conversation en temps réel
  useEffect(() => {
    if (!conversationId) return;

    const messagesQuery = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationId]);

  // 3. Envoyer un message
  const sendMessage = async () => {
    if (!inputText.trim() || !currentUserId) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      let activeConvId = conversationId;

      // Si la conversation n'existe pas encore (premier message)
      if (!activeConvId) {
        if (!recipientId) return;
        
        const newConvRef = doc(collection(db, "conversations"));
        activeConvId = newConvRef.id;

        await setDoc(newConvRef, {
          participants: [currentUserId, recipientId],
          propertyId: propertyId || null,
          propertyTitle: propertyTitle || "Logement",
          createdAt: serverTimestamp(),
          dernierMessage: textToSend,
          updatedAt: serverTimestamp(),
        });

        setConversationId(activeConvId);
      } else {
        // Mettre à jour le dernier message de la conversation existante
        const convRef = doc(db, "conversations", activeConvId);
        await updateDoc(convRef, {
          dernierMessage: textToSend,
          updatedAt: serverTimestamp(),
        });
      }

      // Ajouter le message dans la sous-collection "messages"
      await addDoc(collection(db, "conversations", activeConvId, "messages"), {
        text: textToSend,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
      });

    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMe = item.senderId === currentUserId;
          return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage]}>
              <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                {item.text}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Écrivez votre message..."
          placeholderTextColor="#A0AEC0"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  messageList: { padding: 15, paddingBottom: 20 },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  myMessage: {
    backgroundColor: '#003880',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  otherMessage: {
    backgroundColor: '#EDF2F7',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  messageText: { fontSize: 15 },
  myMessageText: { color: '#FFFFFF' },
  otherMessageText: { color: '#2D3748' },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#2D3748',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#003880',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});