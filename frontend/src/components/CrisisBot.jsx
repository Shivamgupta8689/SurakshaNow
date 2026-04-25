import { format } from 'date-fns';

const CrisisBot = ({ message }) => {
  const time = message.timestamp ? format(new Date(message.timestamp), 'HH:mm') : '';

  return (
    <div className="flex justify-center my-3 animate-fade-in">
      <div className="bg-crisis-teal border border-teal-800 px-4 py-3 max-w-[90%] sm:max-w-[70%] lg:max-w-[60%]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-teal-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">AI</span>
          </div>
          <span className="text-teal-300 text-xs font-semibold uppercase tracking-wide">
            CrisisBot — AI Assistant
          </span>
        </div>
        <p className="text-white text-sm leading-relaxed">{message.message}</p>
        <span className="text-teal-400 text-[10px] block text-right mt-2">{time}</span>
      </div>
    </div>
  );
};

export default CrisisBot;
