import { format } from 'date-fns';

const ChatMessage = ({ message, currentUserId }) => {
  const isOwn = message.senderId === currentUserId;
  const isAI = message.isAIMessage;
  const time = message.timestamp ? format(new Date(message.timestamp), 'HH:mm') : '';

  if (isAI) {
    return (
      <div className="flex justify-center my-3 animate-fade-in">
        <div className="bg-crisis-teal border border-teal-800 px-4 py-3 max-w-[90%] sm:max-w-[70%] lg:max-w-[60%]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 bg-teal-600 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">AI</span>
            </div>
            <span className="text-teal-300 text-xs font-semibold">CrisisBot — AI Assistant</span>
          </div>
          <p className="text-white text-sm leading-relaxed">{message.message}</p>
          <span className="text-teal-400 text-[10px] block text-right mt-1">{time}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} my-2 animate-fade-in`}>
      <div
        className={`px-4 py-3 max-w-[85%] sm:max-w-[70%] lg:max-w-[60%] ${
          isOwn ? 'bg-navy-600 border border-navy-500' : 'bg-navy-750 border border-border'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="text-white text-xs font-semibold">{message.senderName}</span>
        </div>
        <p className="text-text-muted text-[10px] mb-1">
          {message.senderRole}{message.senderPosition ? ` — ${message.senderPosition}` : ''}
        </p>
        <p className="text-white text-sm leading-relaxed">{message.message}</p>
        <span className="text-text-muted text-[10px] block text-right mt-1">{time}</span>
      </div>
    </div>
  );
};

export default ChatMessage;
