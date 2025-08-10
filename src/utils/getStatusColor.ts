export const getStatusColor = (status: string) => {
  switch (status) {
    case "Đang nấu":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "Sẵn sàng":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "Đã phục vụ":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "Chờ thanh toán":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "Đã hủy":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export const getOrderItemStatusColor = (status: string) => {
  switch (status) {
    case "Đang nấu":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "Sẵn sàng":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "Đã phục vụ":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "Đã hủy":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};
