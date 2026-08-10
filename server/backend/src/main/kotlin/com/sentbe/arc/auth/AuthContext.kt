package com.sentbe.arc.auth

import com.sentbe.arc.domain.Customer
import com.sentbe.arc.domain.Staff

object AuthContext {
    private val customerHolder = ThreadLocal<Customer?>()
    private val staffHolder = ThreadLocal<Staff?>()

    var customer: Customer?
        get() = customerHolder.get()
        set(value) = customerHolder.set(value)

    var staff: Staff?
        get() = staffHolder.get()
        set(value) = staffHolder.set(value)

    fun clear() {
        customerHolder.remove()
        staffHolder.remove()
    }
}
